//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_widget_document_previews_response_dto_class.g.dart';

/// DashboardWidgetDocumentPreviewsResponseDtoClass
///
/// Properties:
/// * [items] 
/// * [attentionCount] 
@BuiltValue()
abstract class DashboardWidgetDocumentPreviewsResponseDtoClass implements Built<DashboardWidgetDocumentPreviewsResponseDtoClass, DashboardWidgetDocumentPreviewsResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  @BuiltValueField(wireName: r'attentionCount')
  num? get attentionCount;

  DashboardWidgetDocumentPreviewsResponseDtoClass._();

  factory DashboardWidgetDocumentPreviewsResponseDtoClass([void updates(DashboardWidgetDocumentPreviewsResponseDtoClassBuilder b)]) = _$DashboardWidgetDocumentPreviewsResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardWidgetDocumentPreviewsResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardWidgetDocumentPreviewsResponseDtoClass> get serializer => _$DashboardWidgetDocumentPreviewsResponseDtoClassSerializer();
}

class _$DashboardWidgetDocumentPreviewsResponseDtoClassSerializer implements PrimitiveSerializer<DashboardWidgetDocumentPreviewsResponseDtoClass> {
  @override
  final Iterable<Type> types = const [DashboardWidgetDocumentPreviewsResponseDtoClass, _$DashboardWidgetDocumentPreviewsResponseDtoClass];

  @override
  final String wireName = r'DashboardWidgetDocumentPreviewsResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardWidgetDocumentPreviewsResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
    if (object.attentionCount != null) {
      yield r'attentionCount';
      yield serializers.serialize(
        object.attentionCount,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardWidgetDocumentPreviewsResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DashboardWidgetDocumentPreviewsResponseDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.items.replace(valueDes);
          break;
        case r'attentionCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.attentionCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardWidgetDocumentPreviewsResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardWidgetDocumentPreviewsResponseDtoClassBuilder();
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

