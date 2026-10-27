//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/global_chat_suggestion_bootstrap_dto_class_contract_end_sample.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'global_chat_suggestion_bootstrap_dto_class.g.dart';

/// GlobalChatSuggestionBootstrapDtoClass
///
/// Properties:
/// * [topTagId] 
/// * [topTagName] 
/// * [topTagDocumentCount] 
/// * [amountTaggedDocumentCount] 
/// * [contractEndSample] 
/// * [recentQuestions] 
@BuiltValue()
abstract class GlobalChatSuggestionBootstrapDtoClass implements Built<GlobalChatSuggestionBootstrapDtoClass, GlobalChatSuggestionBootstrapDtoClassBuilder> {
  @BuiltValueField(wireName: r'topTagId')
  String get topTagId;

  @BuiltValueField(wireName: r'topTagName')
  String get topTagName;

  @BuiltValueField(wireName: r'topTagDocumentCount')
  num get topTagDocumentCount;

  @BuiltValueField(wireName: r'amountTaggedDocumentCount')
  num get amountTaggedDocumentCount;

  @BuiltValueField(wireName: r'contractEndSample')
  GlobalChatSuggestionBootstrapDtoClassContractEndSample? get contractEndSample;

  @BuiltValueField(wireName: r'recentQuestions')
  BuiltList<String> get recentQuestions;

  GlobalChatSuggestionBootstrapDtoClass._();

  factory GlobalChatSuggestionBootstrapDtoClass([void updates(GlobalChatSuggestionBootstrapDtoClassBuilder b)]) = _$GlobalChatSuggestionBootstrapDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GlobalChatSuggestionBootstrapDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GlobalChatSuggestionBootstrapDtoClass> get serializer => _$GlobalChatSuggestionBootstrapDtoClassSerializer();
}

class _$GlobalChatSuggestionBootstrapDtoClassSerializer implements PrimitiveSerializer<GlobalChatSuggestionBootstrapDtoClass> {
  @override
  final Iterable<Type> types = const [GlobalChatSuggestionBootstrapDtoClass, _$GlobalChatSuggestionBootstrapDtoClass];

  @override
  final String wireName = r'GlobalChatSuggestionBootstrapDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GlobalChatSuggestionBootstrapDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'topTagId';
    yield serializers.serialize(
      object.topTagId,
      specifiedType: const FullType(String),
    );
    yield r'topTagName';
    yield serializers.serialize(
      object.topTagName,
      specifiedType: const FullType(String),
    );
    yield r'topTagDocumentCount';
    yield serializers.serialize(
      object.topTagDocumentCount,
      specifiedType: const FullType(num),
    );
    yield r'amountTaggedDocumentCount';
    yield serializers.serialize(
      object.amountTaggedDocumentCount,
      specifiedType: const FullType(num),
    );
    if (object.contractEndSample != null) {
      yield r'contractEndSample';
      yield serializers.serialize(
        object.contractEndSample,
        specifiedType: const FullType(GlobalChatSuggestionBootstrapDtoClassContractEndSample),
      );
    }
    yield r'recentQuestions';
    yield serializers.serialize(
      object.recentQuestions,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    GlobalChatSuggestionBootstrapDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required GlobalChatSuggestionBootstrapDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'topTagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.topTagId = valueDes;
          break;
        case r'topTagName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.topTagName = valueDes;
          break;
        case r'topTagDocumentCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.topTagDocumentCount = valueDes;
          break;
        case r'amountTaggedDocumentCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.amountTaggedDocumentCount = valueDes;
          break;
        case r'contractEndSample':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(GlobalChatSuggestionBootstrapDtoClassContractEndSample),
          ) as GlobalChatSuggestionBootstrapDtoClassContractEndSample;
          result.contractEndSample.replace(valueDes);
          break;
        case r'recentQuestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.recentQuestions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GlobalChatSuggestionBootstrapDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GlobalChatSuggestionBootstrapDtoClassBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

