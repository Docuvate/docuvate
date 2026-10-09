//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/layout_ir_widget_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/layout_ir_block_dto.dart';
import 'package:docuvate/src/generated/src/model/layout_ir_line_dto.dart';
import 'package:docuvate/src/generated/src/model/layout_ir_table_dto.dart';
import 'package:docuvate/src/generated/src/model/layout_ir_vector_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_page_dto.g.dart';

/// LayoutIrPageDto
///
/// Properties:
/// * [page] 
/// * [widthPt] 
/// * [heightPt] 
/// * [blocks] 
/// * [lines] 
/// * [tables] 
/// * [vectors] 
/// * [widgets] 
@BuiltValue()
abstract class LayoutIrPageDto implements Built<LayoutIrPageDto, LayoutIrPageDtoBuilder> {
  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'widthPt')
  num get widthPt;

  @BuiltValueField(wireName: r'heightPt')
  num get heightPt;

  @BuiltValueField(wireName: r'blocks')
  BuiltList<LayoutIrBlockDto> get blocks;

  @BuiltValueField(wireName: r'lines')
  BuiltList<LayoutIrLineDto>? get lines;

  @BuiltValueField(wireName: r'tables')
  BuiltList<LayoutIrTableDto>? get tables;

  @BuiltValueField(wireName: r'vectors')
  BuiltList<LayoutIrVectorDto>? get vectors;

  @BuiltValueField(wireName: r'widgets')
  BuiltList<LayoutIrWidgetDto>? get widgets;

  LayoutIrPageDto._();

  factory LayoutIrPageDto([void updates(LayoutIrPageDtoBuilder b)]) = _$LayoutIrPageDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrPageDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrPageDto> get serializer => _$LayoutIrPageDtoSerializer();
}

class _$LayoutIrPageDtoSerializer implements PrimitiveSerializer<LayoutIrPageDto> {
  @override
  final Iterable<Type> types = const [LayoutIrPageDto, _$LayoutIrPageDto];

  @override
  final String wireName = r'LayoutIrPageDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrPageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
    );
    yield r'widthPt';
    yield serializers.serialize(
      object.widthPt,
      specifiedType: const FullType(num),
    );
    yield r'heightPt';
    yield serializers.serialize(
      object.heightPt,
      specifiedType: const FullType(num),
    );
    yield r'blocks';
    yield serializers.serialize(
      object.blocks,
      specifiedType: const FullType(BuiltList, [FullType(LayoutIrBlockDto)]),
    );
    if (object.lines != null) {
      yield r'lines';
      yield serializers.serialize(
        object.lines,
        specifiedType: const FullType(BuiltList, [FullType(LayoutIrLineDto)]),
      );
    }
    if (object.tables != null) {
      yield r'tables';
      yield serializers.serialize(
        object.tables,
        specifiedType: const FullType(BuiltList, [FullType(LayoutIrTableDto)]),
      );
    }
    if (object.vectors != null) {
      yield r'vectors';
      yield serializers.serialize(
        object.vectors,
        specifiedType: const FullType(BuiltList, [FullType(LayoutIrVectorDto)]),
      );
    }
    if (object.widgets != null) {
      yield r'widgets';
      yield serializers.serialize(
        object.widgets,
        specifiedType: const FullType(BuiltList, [FullType(LayoutIrWidgetDto)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrPageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrPageDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'widthPt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.widthPt = valueDes;
          break;
        case r'heightPt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.heightPt = valueDes;
          break;
        case r'blocks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutIrBlockDto)]),
          ) as BuiltList<LayoutIrBlockDto>;
          result.blocks.replace(valueDes);
          break;
        case r'lines':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutIrLineDto)]),
          ) as BuiltList<LayoutIrLineDto>;
          result.lines.replace(valueDes);
          break;
        case r'tables':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutIrTableDto)]),
          ) as BuiltList<LayoutIrTableDto>;
          result.tables.replace(valueDes);
          break;
        case r'vectors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutIrVectorDto)]),
          ) as BuiltList<LayoutIrVectorDto>;
          result.vectors.replace(valueDes);
          break;
        case r'widgets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutIrWidgetDto)]),
          ) as BuiltList<LayoutIrWidgetDto>;
          result.widgets.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrPageDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrPageDtoBuilder();
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

